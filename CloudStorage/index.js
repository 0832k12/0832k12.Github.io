(function (Scratch) {
    'use strict';
    window.rx = {};
    // Create the window.rx.server object
    window.rx.server = {
        ws: null, // WebSocket instance

        // Function to create a WebSocket connection
        createWebSocketConnection(url) {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('连接至服务器');
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
        },

        handleWebSocketMessage(event) {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'success':
                    console.log(data.message);
                    break;
                case 'error':
                    console.error(data.message);
                    break;
                case 'download':
                    this.downloadContent(data.content);
                    break;
                default:
                    console.warn('Unknown message type');
            }
        },

        // Function to upload a file
        uploadFile(file) {
            if (!file) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.html';

                // Add an event listener to the file input to handle file selection
                fileInput.addEventListener('change', (event) => {
                    const selectedFile = event.target.files[0];
                    if (selectedFile && this.ws) {
                        const reader = new FileReader();

                        reader.onload = (readerEvent) => {
                            const content = readerEvent.target.result;
                            this.ws.send(JSON.stringify({ type: 'upload', filename: selectedFile.name, content }));
                        };

                        reader.readAsText(selectedFile);
                    }
                });

                // Trigger the file input dialog
                fileInput.click();
            }
            else {
                if (this.ws) {
                    const reader = new FileReader();

                    reader.onload = (readerEvent) => {
                        const content = readerEvent.target.result;
                        this.ws.send(JSON.stringify({ type: 'upload', filename: file.name, content }));
                    };

                    reader.readAsText(file);
                }
            }
        },

        // Function to download a file
        downloadFile(filename) {
            window.rx.server.filename = filename;
            if (this.ws) {
                this.ws.send(JSON.stringify({ type: 'download', filename }));
            }
        },

        // Function to delete a file
        deleteFile(filename) {
            if (this.ws) {
                this.ws.send(JSON.stringify({ type: 'delete', filename }));
            }
        },

        // Function to download file content
        downloadContent(content) {
            const blob = new Blob([content], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = window.rx.server.filename;
            link.click();

            URL.revokeObjectURL(url);
        },

        // 修改 window.rx.server.checkFileExistence 函数为返回 Promise
        checkFileExistence(filename) {
            return new Promise((resolve, reject) => {
                if (this.ws) {
                    // 发送检查文件是否存在的消息
                    this.ws.send(JSON.stringify({ type: 'check', filename }));

                    // 监听 WebSocket 消息
                    this.ws.addEventListener('message', (event) => {
                        const data = JSON.parse(event.data);

                        if (data.type === 'file_found') {
                            // 文件存在
                            resolve(true);
                        } else if (data.type === 'file_not_found') {
                            // 文件不存在
                            resolve(false);
                        } else {
                            // 处理其他类型的消息
                            reject(new Error('Unexpected message type'));
                        }
                    });
                } else {
                    // WebSocket 连接未准备好
                    reject(new Error('连接未准备好'));
                }
            });
        }
        ,

        // 修改 window.rx.server.getFileContent 函数为返回 Promise
        getFileContent(filename) {
            return new Promise((resolve, reject) => {
                if (this.ws) {
                    // 发送请求获取文件内容的消息
                    this.ws.send(JSON.stringify({ type: 'get_content', filename }));

                    // 监听 WebSocket 消息
                    this.ws.addEventListener('message', (event) => {
                        const data = JSON.parse(event.data);

                        if (data.type === 'get_content') {
                            // 收到文件内容的响应
                            resolve(data.content);
                        } else {
                            // 处理其他类型的消息
                            reject(new Error('Unexpected message type'));
                        }
                    });
                } else {
                    // WebSocket 连接未准备好
                    reject(new Error('连接未准备好'));
                }
            });
        },
        // Add the following function to the window.rx.server object:
        uploadTextContent(textContent, filename) {
            if (this.ws) {
                // Create a Blob from the text content
                const blob = new Blob([textContent], { type: 'text/plain' });

                // Create a File object from the Blob with a specified filename
                const file = new File([blob], filename);

                // Call the existing uploadFile method with the created File object
                this.uploadFile(file);
            }
        },
        // Add the following function to the window.rx.server object:
        changeFileContent(newContent, filename) {
            if (this.ws) {
                // Send a message to the server to change the file content
                this.ws.send(JSON.stringify({ type: 'change_content', filename, content: newContent }));
            }
        }

    };
    // Example usage of functions:
    // window.rx.server.uploadFile(selectedFile);
    // window.rx.server.downloadFile('filename-to-download.txt');
    // window.rx.server.deleteFile('filename-to-delete.txt');
    class fs {
        getInfo() {
            return {
                id: '0832fs',
                name: '云端存储',
                color1: '#609834',
                color2: '#609834',
                color3: '#609832',
                docsURI: 'https://0832.ink/CloudStorage',
                blocks: [
                    {
                        opcode: 'upload',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '上传文件',
                        arguments: {}
                    },
                    {
                        opcode: 'uploadtext',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '上传文本文件 [文件名] 内容 [文本]',
                        arguments: {
                            文本: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                            文件名: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    '---',
                    {
                        opcode: 'download',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '下载文件 [文件]',
                        arguments: {
                            文件: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    {
                        opcode: 'downloadtext',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '获取文本 [文件]',
                        arguments: {
                            文件: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    '---',
                    {
                        opcode: 'delete',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '删除文件 [文件]',
                        arguments: {
                            文件: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    '---',
                    {
                        opcode: 'change',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '更改文本文件 [文件名] 为 [文本]',
                        arguments: {
                            文本: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                            文件名: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    {
                        opcode: 'found',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '存在文件 [文件] ?',
                        arguments: {
                            文件: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            },
                        }
                    },
                    '---',
                    {
                        opcode: 'setserver',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '设置服务器为 [服务器] ?',
                        arguments: {
                            服务器: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'ws://host.0832.ink:32652'
                            },
                        }
                    }
                ]
            };
        }
        upload() {
            window.rx.server.uploadFile();
        }
        uploadtext({ 文本, 文件名 }) {
            window.rx.server.uploadTextContent(文本.toString(), 文件名.toString());
        }
        download({ 文件 }) {
            window.rx.server.downloadFile(文件.toString());
        }
        async downloadtext({ 文件 }) {
            return await window.rx.server.getFileContent(文件.toString());
        }
        delete({ 文件 }) {
            window.rx.server.deleteFile(文件.toString());
        }
        change({ 文本, 文件名 }) {
            window.rx.server.changeFileContent(文本.toString(), 文件名.toString());
        }
        async found({ 文件 }) {
            return await window.rx.server.checkFileExistence(文件.toString());
        }
        setserver({ 服务器 }) {
            window.rx.server.createWebSocketConnection(服务器);
        }
    }
    Scratch.extensions.register(new fs());
})(Scratch);
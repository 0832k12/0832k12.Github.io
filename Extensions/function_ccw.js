class evaal {
    getInfo() {
        return {
            id: 'function0832',
            name: 'Function',
            color1: '#f54242',
            color2: '#f54242',
            color3: '#f54242',
            blocks: [
                {
                    opcode: 'function',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '声明一个function [a]',
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "return 1+1;"
                        }
                    }
                },
                {
                    opcode: 'dofunctioncm',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '执行Function [a]',
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: ""
                        }
                    }
                },
                {
                    opcode: 'dofunction',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '执行Function [a]',
                    arguments: {
                        a: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: ""
                        }
                    }
                }
            ]
        };
    }
    function({ a }) {
        try {
            const result = new Function(a);
            return result.toString();
        }
        catch (error) {
            if (0) {
                console.error(error);
                return "Error: " + error.message;
            }
            else {
                return "";
            }
        }
    }
    dofunction({ a }) {
        try {
            const go = new Function(a);
            const result = go();
            return result;
        }
        catch (error) {
            if (0) {
                console.error(error);
                return "Error: " + error.message;
            }
            else {
                return "";
            }
        }
    }
    dofunctioncm({ a }) {
        try {
            const go = new Function(a);
            const result = go();
            return result;
        }
        catch (error) {
            if (0) {
                console.error(error);
                return "Error: " + error.message;
            }
            else {
                return "";
            }
        }
    }
}

Scratch.extensions.register(new evaal());
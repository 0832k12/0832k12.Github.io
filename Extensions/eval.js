(function (Scratch) {
    'use strict';
    const BlockType = Scratch.BlockType;
    const ArgumentType = Scratch.ArgumentType;
    const formatMessage = Scratch.translate;
    formatMessage.setup({
        zh:{
            'rc.rxblocks.eval.eval': '执行 JavaScript [a]',
            'rc.rxblocks.eval.evallist': '从列表中执行 JavaScript [a]',
            'rc.rxblocks.eval.evalfile': '从文件中执行 JavaScript',
        }
    });
    const MODE_MODAL = 'modal';
    const MODE_IMMEDIATELY_SHOW_SELECTOR = 'selector';
    const MODE_ONLY_SELECTOR = 'only-selector';
    let openFileSelectorMode = MODE_MODAL;

    const AS_TEXT = 'text';
    const AS_DATA_URL = 'url';

    /**
     * @param {string} accept See MODE_ constants above
     * @param {string} as See AS_ constants above
     * @returns {Promise<string>} format given by as parameter
     */
    const showFilePrompt = (accept, as) => new Promise((_resolve) => {
        // We can't reliably show an <input> picker without "user interaction" in all environments,
        // so we have to show our own UI anyways. We may as well use this to implement some nice features
        // that native file pickers don't have:
        //  - Easy drag+drop
        //  - Reliable cancel button (input cancel event is still basically nonexistent)
        //    This is important so we can make this just a reporter instead of a command+hat block.
        //    Without an interface, the script would be stalled if the prompt was just cancelled.

        /** @param {string} text */
        const callback = (text) => {
            _resolve(text);
            outer.remove();
            document.body.removeEventListener('keydown', handleKeyDown);
        };

        let isReadingFile = false;

        /** @param {File} file */
        const readFile = (file) => {
            if (isReadingFile) {
                return;
            }
            isReadingFile = true;

            const reader = new FileReader();
            reader.onload = () => {
                callback(/** @type {string} */(reader.result));
            };
            reader.onerror = () => {
                console.error('Failed to read file as text', reader.error);
                callback('');
            };
            if (as === AS_TEXT) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        };

        /** @param {KeyboardEvent} e */
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                callback('');
            }
        };
        document.body.addEventListener('keydown', handleKeyDown, {
            capture: true
        });

        const INITIAL_BORDER_COLOR = '#888';
        const DROPPING_BORDER_COLOR = '#03a9fc';

        const outer = document.createElement('div');
        outer.className = 'extension-content';
        outer.style.position = 'fixed';
        outer.style.top = '0';
        outer.style.left = '0';
        outer.style.width = '100%';
        outer.style.height = '100%';
        outer.style.display = 'flex';
        outer.style.alignItems = 'center';
        outer.style.justifyContent = 'center';
        outer.style.background = 'rgba(0, 0, 0, 0.5)';
        outer.style.zIndex = '20000';
        outer.style.color = 'black';
        outer.style.colorScheme = 'light';
        outer.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                modal.style.borderColor = DROPPING_BORDER_COLOR;
            }
        });
        outer.addEventListener('dragleave', () => {
            modal.style.borderColor = INITIAL_BORDER_COLOR;
        });
        outer.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                e.preventDefault();
                readFile(file);
            }
        });
        outer.addEventListener('click', (e) => {
            if (e.target === outer) {
                callback('');
            }
        });

        const modal = document.createElement('button');
        modal.style.boxShadow = '0 0 10px -5px currentColor';
        modal.style.cursor = 'pointer';
        modal.style.font = 'inherit';
        modal.style.background = '#282c36';
        modal.style.padding = '16px';
        modal.style.borderRadius = '16px';
        //modal.style.border = `8px dashed ${INITIAL_BORDER_COLOR}`;
        modal.style.position = 'relative';
        modal.style.textAlign = 'center';
        modal.addEventListener('click', () => {
            input.click();
        });
        modal.focus();
        outer.appendChild(modal);

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.addEventListener('change', (e) => {
            // @ts-expect-error
            const file = e.target.files[0];
            if (file) {
                readFile(file);
            }
        });

        const title = document.createElement('div');
        title.style.color = 'white';
        title.textContent = '选择Javascript文件';
        title.style.fontSize = '1.5em';
        title.style.marginBottom = '8px';
        modal.appendChild(title);

        const subtitle = document.createElement('div');
        //const formattedAccept = accept || 'any';
        //subtitle.textContent = `Accepted formats: ${formattedAccept}`;
        modal.appendChild(subtitle);

        document.body.appendChild(outer);

        if (openFileSelectorMode === MODE_IMMEDIATELY_SHOW_SELECTOR || openFileSelectorMode === MODE_ONLY_SELECTOR) {
            input.click();
        }

        if (openFileSelectorMode === MODE_ONLY_SELECTOR) {
            // Note that browser support for cancel is currently quite bad
            input.addEventListener('cancel', () => {
                callback('');
            });
            outer.remove();
        }
    });
    class evaal {
        constructor(runtime) {
            this.runtime = Scratch.vm.runtime;
            this.messageQueue = [];
            this.recording = [];
            this.logs = [];
            this.recordingDelay = 1000;
        }
        getInfo() {
            return {
                id: 'eval',
                name: 'Eval',
                blocks: [
                    {
                        opcode: 'evalcm',
                        blockType: BlockType.COMMAND,
                        text: formatMessage({
                            id: 'rc.rxblocks.eval.eval',
                            default: 'do Javascript [a]',
                        }),
                        arguments: {
                            a: {
                                type: ArgumentType.STRING,
                                defaultValue: "alert('0832')"
                            }
                        }
                    },
                    {
                        opcode: 'evallist',
                        blockType: BlockType.COMMAND,
                        text: formatMessage({ id: 'rc.rxblocks.eval.evallist', default: 'do Javascript from list [a]' }),
                        arguments: {
                            a: {
                                type: ArgumentType.STRING,
                                menu: 'lists'
                            }
                        }
                    },
                    {
                        opcode: 'evalfile',
                        blockType: BlockType.COMMAND,
                        text: formatMessage({ id: 'rc.rxblocks.eval.evalfile', default: 'do Javascript from file' }),
                    },
                    '---',

                    {
                        opcode: 'eval',
                        blockType: BlockType.REPORTER,
                        text: formatMessage({
                            id: 'rc.rxblocks.eval.eval',
                            default: 'do Javascript [a]',
                        }),
                        arguments: {
                            a: {
                                type: ArgumentType.STRING,
                                defaultValue: "1+1"
                            }
                        }
                    }
                ],
                menus: {
                    lists: {
                        acceptReporters: true,
                        items: '_getListMenu',
                    }
                }
            };
        }
        _getListMenu() {
            const lists = this.runtime.getAllVarNamesOfType('list')
            return lists.length == 0 ? [" "] : lists
        }
        eval({ a }) {
            return eval(a)
        }
        evalcm({ a }) {
            eval(a)
        }
        async evalfile() {
            const a = await showFilePrompt('.js', AS_TEXT)
            eval(a)
            return;
        }
        evallist({ a }) {
            const list = vm.runtime.getTargetForStage().lookupVariableByNameAndType(a, 'list');
            const array = list.value;
            const result = array.join('\n');;
            eval(result)
            return;
        }
    }
    Scratch.extensions.register(new evaal());
})(Scratch);

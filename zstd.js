// @ts-nocheck
function createZstdModule() {
    var Module = {
        preRun: [],
        postRun: [],
        print: function(text) {
            console.log(text);
        },
        printErr: function(text) {
            console.error(text);
        }
    };

    var wasmMemory;
    var ABORT = false;
    var WASM_PAGE_SIZE = 65536;
    var buffer;
    var HEAPU8;

    function updateGlobalBufferAndViews(buf) {
        buffer = buf;
        HEAPU8 = new Uint8Array(buf);
    }

    // Define the functions required by the WASM module
    var asmLibraryArg = {
        a: function(condition, filename, line, func) {
            abort('Assertion failed: ' + condition);
        },
        b: function(size) {
            // emscripten_resize_heap
            try {
                wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16);
                updateGlobalBufferAndViews(wasmMemory.buffer);
                return 1;
            } catch (e) {
                return 0;
            }
        },
        c: function(val) {
            // setTempRet0
            tempRet0 = val;
        }
    };

    function abort(what) {
        Module.printErr(what);
        ABORT = true;
        throw new Error(what);
    }

    var tempRet0 = 0;

    // Initialize function
    async function init(wasmPath) {
        try {
            const response = await fetch(wasmPath);
            const wasmBinary = await response.arrayBuffer();

            // Create the import object with the required functions
            const info = {
                a: asmLibraryArg,
                env: {
                    memory: new WebAssembly.Memory({ 
                        initial: 256,
                        maximum: 32768 // Allow growth up to 2GB
                    })
                }
            };

            const result = await WebAssembly.instantiate(wasmBinary, info);
            
            // Store the exports
            Module.asm = result.instance.exports;
            
            // Set up memory
            wasmMemory = Module.asm.d || result.instance.exports.memory;
            updateGlobalBufferAndViews(wasmMemory.buffer);

            // Initialize other necessary parts
            Module.HEAPU8 = HEAPU8;
            Module._malloc = Module.asm.q;
            Module._free = Module.asm.r;
            Module._ZSTD_isError = Module.asm.f;
            Module._ZSTD_compressBound = Module.asm.g;
            Module._ZSTD_compress = Module.asm.k;
            Module._ZSTD_decompress = Module.asm.p;
            Module._ZSTD_getFrameContentSize = Module.asm.n;

            return Module;
        } catch (e) {
            console.error('Failed to initialize WASM:', e);
            throw e;
        }
    }

    Module.init = init;
    return Module;
}

// Create the module and expose it globally
window.ZstdModule = createZstdModule();

// Expose convenience functions
window.zstdInit = async function(wasmPath) {
    return await window.ZstdModule.init(wasmPath);
};

window.zstdCompress = function(data, level = 3) {
    if (!window.ZstdModule.asm) {
        throw new Error('Zstd not initialized. Call zstdInit first.');
    }

    const size = data.length;
    const bound = window.ZstdModule._ZSTD_compressBound(size);
    const inPtr = window.ZstdModule._malloc(size);
    const outPtr = window.ZstdModule._malloc(bound);
    
    window.ZstdModule.HEAPU8.set(data, inPtr);
    
    const compressedSize = window.ZstdModule._ZSTD_compress(
        outPtr, bound,
        inPtr, size,
        level
    );
    
    if (window.ZstdModule._ZSTD_isError(compressedSize)) {
        window.ZstdModule._free(inPtr);
        window.ZstdModule._free(outPtr);
        throw new Error('Compression failed');
    }
    
    const result = new Uint8Array(
        window.ZstdModule.HEAPU8.buffer,
        outPtr,
        compressedSize
    ).slice();
    
    window.ZstdModule._free(inPtr);
    window.ZstdModule._free(outPtr);
    
    return result;
};

window.zstdDecompress = function(data) {
    if (!window.ZstdModule.asm) {
        throw new Error('Zstd not initialized. Call zstdInit first.');
    }

    const size = data.length;
    const contentSize = window.ZstdModule._ZSTD_getFrameContentSize(data.buffer, size);
    
    const inPtr = window.ZstdModule._malloc(size);
    const outPtr = window.ZstdModule._malloc(contentSize);
    
    window.ZstdModule.HEAPU8.set(data, inPtr);
    
    const decompressedSize = window.ZstdModule._ZSTD_decompress(
        outPtr, contentSize,
        inPtr, size
    );
    
    if (window.ZstdModule._ZSTD_isError(decompressedSize)) {
        window.ZstdModule._free(inPtr);
        window.ZstdModule._free(outPtr);
        throw new Error('Decompression failed');
    }
    
    const result = new Uint8Array(
        window.ZstdModule.HEAPU8.buffer,
        outPtr,
        decompressedSize
    ).slice();
    
    window.ZstdModule._free(inPtr);
    window.ZstdModule._free(outPtr);
    
    return result;
};
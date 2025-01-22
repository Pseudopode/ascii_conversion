# ASCII Conversion Tool

![Screenshot of the webpage](./screenshot4.png)

A web-based tool that provides multiple text conversion algorithms including Base64, Base-32k, GZip, LZMA, Brotli, and Zstd compression, with additional support for smart Run-Length Encoding (RLE) and color-coded text encoding. The tool is implemented in JavaScript and runs entirely in the browser.

Try it out here: [ASCII Conversion Tool](https://pseudopode.github.io/ascii_conversion/)

## Features

- **Multiple Conversion Methods:**
  - Base64 encoding/decoding
  - Base-32k encoding/decoding (using Unicode characters)
  - GZip compression/decompression
  - LZMA compression/decompression
  - Brotli based compression/decompression (Implementation from https://github.com/dominikhlbg/brotlijs/)
  - Zstd compression/decompression (Implementation from https://github.com/bokuweb/zstd-wasm)

- **Smart Run-Length Encoding (RLE):**
  - Available for both input and output text
  - Implements a "smart" RLE algorithm that only compresses when beneficial
  - Uses "RLEv1:" prefix to indicate encoded content
  - Automatically determines whether to use RLE based on efficiency

- **Unicode Byte Representation:**
  - Option to represent compressed bytes (GZip/LZMA/Brotli/Zstd) as single Unicode characters
  - Uses characters from the CJK Unified Ideographs block (0x4E00-0x9FFF)
  - Helps avoid issues with unprintable characters

- **Color Coding Features:**
  - Optional text color coding for enhanced data density (3 additional bytes per character)
  - Optional background color coding for further data compression (3 additional bytes per character)
  - Compatible with Unicode byte representation
  - Visual representation of data using RGB color values

- **Magic String Prefix:**
  - Compact "MGK2" prefix format for encoding compression settings
  - Stores compression type, level, and encoding flags
  - Enables automatic retrieval and application of compression settings

- **User Interface Features:**
  - Real-time character counting
  - Error handling with temporary error messages
  - Responsive design
  - Clear conversion controls
  - Adjustable compression levels for Brotli and Zstd

## Implementation Details

### RLE Implementation
The tool uses a smart RLE algorithm that:
1. Identifies consecutive runs of the same character
2. Only applies RLE when the encoded form (`char + count`) is shorter than the raw run
3. Automatically falls back to raw representation when RLE would not save space

### Base-32k Encoding
Utilizes Unicode characters (starting at 0x4E00) to encode data more efficiently than Base64, using approximately 15 bits per character instead of 6 bits.

### Color Coding Implementation
The tool supports two color coding modes:
1. Text color: Encodes 3 bytes of data in the RGB values of the text color
2. Background color: Adds 3 more bytes using the background RGB values
Combined with Unicode byte representation, this allows storing up to 7 bytes per character.

### Compression Options
- **Zstd**: Offers configurable compression levels with level 3 as default, providing a good balance between compression ratio and speed
- **Brotli**: Supports quality settings from 0 to 11 for fine-tuned compression

## Libraries Used
- `pako` (v2.1.0) - For GZip compression
- `lzma-min.js` - For LZMA compression
- `brotli.js` - For Brotli compression/decompression
- `zstd-wasm` - For Zstd compression/decompression (from @bokuweb/zstd-wasm)
- Web Workers (`lzma_worker.js`) - For asynchronous LZMA processing

## Development

This project was developed with assistance from:
- GPT-4
- Claude (Anthropic)

## Browser Compatibility

The tool requires a modern browser with support for:
- TextEncoder/TextDecoder APIs
- Web Workers
- ES6+ JavaScript features
- WebAssembly (for Zstd compression)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
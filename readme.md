# 2.0.0 / 2019-11-09

## 💥 Breaking Changes

- Drop support for Node.js <8

  Migration Guide:

  Upgrade to Node.js 8.0.0 or newer.

- Build using N-API instead of NAN

  Migration Guide:

  - Upgrade to at least Node.js 8.6.0 for continued support.
  - The `data` parameter to `encode` does no longer accept 16-bit, 32-bit, or float arrays.
  - The output from `decode` is now an instance of `ImageData`, meaning that `data` is an `Uint8ClampedArray`.


## 🐛 Fixes

- Hold references to buffers while working

# 1.3.0 / 2019-11-08

## 🎉 Enhancements

- Upgrade lodepng to 20190914

# 1.2.0 / 2018-08-08

## 🎉 Enhancements

- Improve TypeScript typings

# 1.1.0 / 2017-08-20

## 🎉 Enhancements

- Add TypeScript typings

# 1.0.0 / 2017-08-17

## 💥 Breaking Changes

- Switch to promise based interface

## 🎉 Enhancements

- Update all dependencies

## 🌹 Internal Changes

- Cleanup git ignore file
- Cleanup package.json
- Change casing of readme file
- Prettify binding.gyp

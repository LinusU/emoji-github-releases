# Emoji Github Releases

Small tool to automatically update a package GitHub Releases from an [emoji-commit](https://github.com/LinusU/emoji-commit) Git history.

## Installation

```sh
npm install --global emoji-github-releases
```

## Usage

Just run the command in a Git repository that has a GitHub `origin` remote. It will prompt you to confirm every release it wants to create or update.

The first time you run the program it will instruct you how to create a GitHub access token, which it will then save for subsequent runs.

```sh
emoji-github-releases
```

## Example

```sh
$ emoji-github-releases
Using GitHub token from config at /Users/linus/Library/Application Support/emoji-github-releases/config.json
============================== v0.1.0 ==============================
🚢 0.1.0 / 2019-11-22

## 🎉 Enhancements

- Add initial implementation

## 🌹 Internal Changes

- Add Travis CI integration
============================== v0.1.0 ==============================
Create this release [y,n]? y
All done
```

![Example Rendering](https://user-images.githubusercontent.com/189580/69447431-66b57680-0d4e-11ea-9441-2af768f8f738.png)

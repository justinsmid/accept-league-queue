# Accept league queue
Desktop application used to interact with the League of Legends client through external sources such as Twitch chat.

## Installation

### Official releases
To download and install official releases, visit [GitHub releases](https://github.com/justinsmid/accept-league-queue/releases) (Latest release [here](https://github.com/justinsmid/accept-league-queue/releases/tag/v0.2)).
From these pages, you can download the '`vX.Y.<name>.app.zip`' file, unpack it, and run '`<name> Setup X.Y.Z.exe`'. (Where X, Y and Z refer to version numbers, and `<name>` to the name of the application at that time)

**Note**: To make local storage work properly, you may have to close the app and run the '`<name>.exe`' file that was installed after you ran '`<name> Setup X.Y.Z.exe`' instead.

### From source
To run the application from source, undergo the following steps:

1. Install [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (If not already installed, check using `git --version`)
2. Install [node](https://nodejs.org/en/download/) (If not already installed, check using `node --version`)
3. Install [expo](https://expo.io/)
   - Run `npm install -g expo-cli` to install it
4. Install [node-foreman](https://github.com/strongloop/node-foreman)
   - Run `npm install -g foreman` to install it
5. Clone repository
   - `git clone https://github.com/justinsmid/accept-league-queue.git`
6. Go to cloned directory
   - `cd <path/to/directory>`
7. Install dependencies
   - `npm install`
8. Run the application
   - `npm run dev`

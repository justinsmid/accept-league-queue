# Accept league queue
Desktop application used to interact with the League of Legends client through external sources such as Twitch chat.

## Installation

### Official releases
To download and install official releases, visit [GitHub releases](https://github.com/justinsmid/accept-league-queue/releases) (Latest release [here](https://github.com/justinsmid/accept-league-queue/releases/tag/v0.2)).

From these pages, you can download the '`vX.Y.Z<name>.app.zip`' file, unpack it, and run '`<name> Setup X.Y.Z.exe`'. (Where X, Y and Z refer to version numbers, and `<name>` to the name of the application)

Running this Setup `.exe`-file will install the application to the start bar accessible through the Windows-key, and to `C:\Users\<user>\AppData\Local\Programs\<name>\`, where `<user>` is your Windows account's name, and `<name>` is the name of the application.

To ensure everything works properly, please run the application from here, and not from the Setup `.exe`-file that installed it.

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

## For developers

### Publishing a release
To publish a new release, undergo the following steps:

1. `npm install`
2. `npm run build`
3. `npm run dist`
4. archive all files created in the /dist folder to a zip
5. Go to https://github.com/justinsmid/accept-league-queue/releases/new
6. Write release information
7. Upload the .zip archive, as well as the `latest.yml` inside of the zip, and the .exe installer. (Make sure the .exe installer's name matches the `path` in `latest.yml`)
8. Publish the release!
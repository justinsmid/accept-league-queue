# Accept league queue
App to accept league queues using your phone.

## Steps to make it work

### Download and install
1. Install [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (If not already installed, check if `git --version` works)
2. Install [node](https://nodejs.org/en/download/) (If not already installed, check if `node --version` works)
3. Install [expo](https://expo.io/) (Run `npm install -g expo-cli` to install it)
4. Install [ngrok](https://ngrok.com/download) (If not already installed, check if `ngrok --version` works)
5. Clone repository (`git clone https://github.com/justinsmid/accept-league-queue.git`)

### Edit (currently) hardcoded things

#### /app/src/Home.js
Run `ngrok http 3000`, copy the first `Forwarding` value (e.g.: https://56156c357e68.ngrok.io) to [this](https://github.com/justinsmid/accept-league-queue/blob/3bcf51d8f431bcd2bb78c7e06931bdf076a7fc15/app/src/Home.js#L4) line

#### /server/index.js
1. Open your League of Legends client
2. Find your `lockfile` file (Found in your league client's folder, e.g.: "D:\League Of Legends\")
3. Copy the contents of the lockfile to [this](https://github.com/justinsmid/accept-league-queue/blob/f54a76e13c4bb4ea7d1418485f64b1ce649bd73a/server/index.js#L8) line

### Run the app
#### Server
```console
cd {clone_dir}/server
npm start
```

#### App
```
cd {clone_dir}/app
npm run android (or 'npm run ios' if you are on iOS)
```

Where {clone_dir} should be replaced with the directory you cloned the repository to.

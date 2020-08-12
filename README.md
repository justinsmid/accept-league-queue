# Accept league queue
App to accept league queues using your phone.

## Steps to make it work

### Download and install
1. Install [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (If not already installed, check if `git --version` works)
2. Install [node](https://nodejs.org/en/download/) (If not already installed, check if `node --version` works)
3. Install [expo](https://expo.io/)
   - Run `npm install -g expo-cli` to install it
4. Install [node-foreman](https://github.com/strongloop/node-foreman)
   - Run `npm install -g foreman` to install it
5. Clone repository (`git clone https://github.com/justinsmid/accept-league-queue.git`)

### Edit (currently) hardcoded things

#### /app/src/Home.js
1. Run the server (see [this](https://github.com/justinsmid/accept-league-queue/blob/master/README.md#server))
   - This should output `Server listening at '{localhost_url}', ngrok running at '{ngrok_url}'`
2. Copy the ngrok_url from the above output to [this](https://github.com/justinsmid/accept-league-queue/blob/3bcf51d8f431bcd2bb78c7e06931bdf076a7fc15/app/src/Home.js#L4) line

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

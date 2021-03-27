import React, {useState} from 'react';
import './App.sass';
import {BrowserRouter as Router, Switch, Route, useLocation} from 'react-router-dom';
import routes from '../routes';
import NavigationBar from '../components/navBar/NavigationBar';
import {useEffectOnce} from '../util/util';
const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;
const {dialog} = electron.remote;

function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const onLocationChange = location => {
    setCurrentPath(location.pathname);
  };

  useEffectOnce(() => {
    ipcRenderer.on('AUTO_UPDATER_EVENT', (event) => {
      if (event === 'update-downloaded') {
        dialog.showMessageBox(
          {
            title: 'New version downloaded',
            message: 'A new version of the application has been detected and will be installed shortly.'
          }
        );
      }
    });
  });

  return (
    <div className="app">
      <Router>
        <LocationListener onChange={onLocationChange} />
        <NavigationBar currentPath={currentPath} />
        <Switch className="switch">
          {routes.map(route => (
            <Route key={route.title} exact path={route.path} component={route.component} />
          ))}
        </Switch>
      </Router>
    </div>
  );
}

const LocationListener = ({onChange}) => {
  const location = useLocation();
  // eslint-disable-next-line
  React.useEffect(() => onChange(location), [location]);
  return null;
};

export default App;
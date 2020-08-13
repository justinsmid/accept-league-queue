import React, {useState} from 'react';
import './App.sass';
import {BrowserRouter as Router, Switch, Route, Redirect, useLocation} from 'react-router-dom';
import routes from '../routes';
import NavigationBar from '../components/navBar/NavigationBar';

function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const onLocationChange = location => {
    setCurrentPath(location.pathname);
  };

  return (
    <div className="app">
      <Router>
        <LocationListener onChange={onLocationChange} />
        <NavigationBar currentPath={currentPath} />
        <Switch className="switch">
          <Route exact path="/" render={() => <Redirect to="/landing" />} />
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
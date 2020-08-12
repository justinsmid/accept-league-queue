import React, {useState} from 'react';
import './App.sass';
import './menu.sass';
import {BrowserRouter as Router, Switch, Route, Redirect, Link, useLocation} from 'react-router-dom';
import {slide as Menu} from 'react-burger-menu';
import routes from './routes';

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const toggleShowMenu = () => setShowMenu(!showMenu);

  const [currentPath, setCurrentPath] = useState('/');

  const onLocationChange = location => {
    setCurrentPath(location.pathname);
  };

  return (
    <div className="app">
      <Router>
        <LocationListener onChange={onLocationChange} />
        <div className="menu">
          <Menu isOpen={showMenu} onStateChange={menuState => setShowMenu(menuState.isOpen)}>
            {routes.map(route => {
              const matchesCurrentPath = (route.path === currentPath);
              return (
                <Link
                  key={route.title}
                  id={route.title}
                  to={route.path}
                  onClick={toggleShowMenu}
                  className={`menu-item ${matchesCurrentPath ? 'current' : ''}`}
                >
                  {route.title}
                </Link>
              );
            })}
          </Menu>
        </div>
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
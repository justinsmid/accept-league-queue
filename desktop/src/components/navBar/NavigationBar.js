import React, {useState} from 'react';
import {slide as Menu} from 'react-burger-menu';
import {Link} from 'react-router-dom';
import routes from '../../routes';
import './menu.sass';

export default ({currentPath}) => {
  const [showMenu, setShowMenu] = useState(false);
  const toggleShowMenu = () => setShowMenu(!showMenu);

    return (
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
    );
};
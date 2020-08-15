import React from "react";
import {getGlobal} from "../../util/util";
import QRCode from "react-qr-code";
import './LandingPage.sass';
import {Link} from "react-router-dom";

export default props => {
    const serverUrl = getGlobal('serverUrl');
    return (
        <div className="page landing-page">
            <div className="text">
                <p>Welcome! If you are using the mobile app,<br />please open it and fill in the following URL, or scan the QR code using the app:</p>
                <div className="server-url">
                    <p>{serverUrl}</p>
                    <QRCode value={serverUrl} size={128} />
                </div>
                <p className="skip-text">If you are not using the mobile app, you may skip this page.</p>
            </div>
            <Link to="/dashboard" className="continue">Continue {'>'}</Link>
        </div>
    );
};
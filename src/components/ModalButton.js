import React, {useState} from 'react';
import {Dialog} from '@material-ui/core';
import './components.sass';
import Icon from '@material-ui/core/Icon';

// TODO: Make a <ControlledModalButton /> where the modal only listens to props.open
export default ({onClick, onClose, buttonTitle, underlineTitle=true, modalProps, children, ...props}) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = e => setOpen(!open);
    const close = e => {
        setOpen(false);
        onClose && onClose(e);
    }

    const onClickButton = e => {
        toggleOpen();
        onClick && onClick(e);
    }

    return (
        <div className="modal-button-container" {...props}>
            <p onClick={onClickButton} style={underlineTitle ? {textDecoration: 'underline'} : {}}>{buttonTitle}</p>
            <Dialog style={{borderRadius: '0'}} {...modalProps} open={open} onBackdropClick={close} >
                <>
                    {children}
                    <Icon className="close-modal-button" onClick={close}>close</Icon>
                </>
            </Dialog>
        </div>
    );
};
import React from 'react';
import './ModalConfirm.css'; // stylizacja z osobnego pliku
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes,faCheck} from '@fortawesome/free-solid-svg-icons'; 
const ModalConfirm = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="confirm"><FontAwesomeIcon icon={faCheck}/></button>
          <button onClick={onCancel} className="cancel"><FontAwesomeIcon icon={faTimes}/></button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;

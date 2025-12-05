import React from 'react';
import QRCode from 'react-qr-code';

const QRCodeDisplay = ({ value, size = 140 }) => {
    return (
        <div className="bg-white p-2 rounded-lg inline-block">
            <QRCode
                size={size}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={value}
                viewBox={`0 0 256 256`}
            />
        </div>
    );
};

export default QRCodeDisplay;

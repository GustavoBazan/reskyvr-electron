const { ipcRenderer } = require("electron");

const digitalScreen = {
    add: () => ipcRenderer.invoke("DEVICEINSTALLER64_ENABLEIDD"),
}

const GenerateScreenButton: React.FC = () => {

    function generateScreen() {
        digitalScreen.add();
    }

    return (

        <button className="ml-4" onClick={() => generateScreen()}>[ Generate Screen ]</button>

    );

};

export default GenerateScreenButton;
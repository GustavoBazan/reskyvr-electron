const { ipcRenderer } = require("electron");

import { useRef } from "react";

const desktopCapturer = {
    getSources: (opts:any) =>
      ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", opts),
};

// - - - SETUP CONTAINER - - -

interface SetupContainerProps {
    streams: never[];
    setStreams: React.Dispatch<React.SetStateAction<never[]>>;
}

const SetupContainer: React.FC<SetupContainerProps> = ({ streams, setStreams }) => {

    return (
        <div id="Container" className="flex flex-row self-center outline outline-8 shadow-2xl rounded-md p-20">
            
            <AddScreenButton streams={streams} setStreams={setStreams} />
            {
                streams.length > 0 ?
                <AddScreenButton streams={streams} setStreams={setStreams} /> :
                <></>
            }
            {
                streams.length > 1 ?
                <AddScreenButton streams={streams} setStreams={setStreams} /> :
                <></>
            }

        </div>
    );

};


// - - - ADD SCREEN BUTTON - - -

interface AddScreenButtonProps {
    streams: never[];
    setStreams: React.Dispatch<React.SetStateAction<never[]>>;
};

const AddScreenButton: React.FC<AddScreenButtonProps> = ({ streams, setStreams }) => {

    let buttonRef:any = useRef();

    async function getDisplay(button:any) {

        const inputSources = await desktopCapturer.getSources({
            types: ["screen"],
        });

        if (inputSources.length > streams.length) {
            let constraints = {
                audio: false,
                video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: await inputSources[streams.length].id,
                },
                },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints as any);

            setStreams(
                [
                    ...streams,
                    (stream as never)
                ]
            );

            const videoElement:any = document.createElement("video");
            
            document.getElementById('Container')?.appendChild(videoElement);
            videoElement.srcObject = stream;
            videoElement.play();
            videoElement.className = 'h-32 mr-3 -mt-8';

            button.current.remove();
        } else {
            alert('No more screens to add. Generate a new one!');
        };

    }

    return (
        <button
        className="text-5xl outline rounded-full h-20 w-20"
        ref={buttonRef}
        onClick={() => getDisplay(buttonRef)}
        >+</button>
    );

};

export default SetupContainer;
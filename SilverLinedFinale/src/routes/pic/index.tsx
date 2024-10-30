import { FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";

interface Props {
}

const Pic: FunctionalComponent<Props> = (props: Props) => {
  const [pic, setPic] = useState<string>("/assets/images/D20.png");

  // gets called when this route is navigated to
  useEffect(() => {
    const handleStorageChange = (event:StorageEvent) => {
      console.log("HERE")
      if (event.key === 'd_pic') {
        let newVal = event.newValue === null ? "/assets/images/D20.png" : event.newValue;
        setPic(newVal);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // update the current time
  const openFullscreen = (): void => {
    document.getElementById('id_picture')?.requestFullscreen();
  };

  return (
    <div class={style.profile}>
      <h1>Picture Page</h1>
      <p><button class={style.buttonHighlighted} onClick={openFullscreen}>Click</button> to make Full Screen</p>
      <img id="id_picture" class={style.dieImage} src={pic}/>
    </div>
  );
};

export default Pic;

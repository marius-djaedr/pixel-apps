import { Fragment, FunctionalComponent, h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
  requestPixel,
  Color,
  Pixel,
  repeatConnect,
  PixelRollState,
} from "@systemic-games/pixels-web-connect";
import {
  AppDataSet,
  EditAnimationRainbow,
  EditAnimationGradientPattern,
  EditRgbGradient,
  EditAnimationGradient,
  EditAnimationSimple,
  EditDataSet,
  createDataSetForAnimations,
} from "@systemic-games/pixels-edit-animation";
import PixelInfoBox from "./PixelInfoBox";
import style from "./style.css";
import { usePixelStatus } from "@systemic-games/pixels-react";

type PlayMode = "setup" | "transfer" | "silent" | "listen";

const minNumDice = 1;
const delayBeforeAnimResults = 100;
const delayBetweenAnimResults = 2000;


const imgs = [
  'vecna',//1
  'vecna',//2
  'gruumsh',//3
  'tuern',//4
  'khala',//5
  'gorellik',//6
  'stranger',//7
  'neutral',//8
  'neutral', //9
  'neutral',//10
  'neutral',//11
  'neutral',//12
  'neutral',//13
  'neutral',//14
  'garl',//15
  'io',//16
  'amoth',//17
  'yondalla',//18
  'boccob',//19
  'boccob'//20
];
const resultTexts = [
  '1 - Vecna - whispers all around. Start of turn, DC 45 Will save or doomed 1 and -2 saves against mental, fear, and death affects for rest of combat (save affects only 1 round)',
  '2 - Vecna - whispers all around. Start of turn, DC 45 Will save or doomed 1 and -2 saves against mental, fear, and death affects for rest of combat (save affects only 1 round)',
  '3 - Gruumsh - double all damage dealt this round (including from enemies)',
  '4 - Tuern - all attacks resolve at 1 step higher (including from enemies)',
  '5 - Khala - massive storms, lightning and wind. DC 45 Reflex save to take any move action within the winds; flying creatures use the outcome one degree of success worse than what they roll. Creatures who critically fail are blown 30 feet in a random direction, knocked prone, and take 4d6 electricity damage.',
  '6 - Gorellik - massive beast charges across the battlefield. DC 45 basic reflex save, 5d10+20 damage',
  '7 - Stranger - life is being siphoned. if take damage, DC 45 Fort save or Drained 1',
  '8 - Yldren x Bob (dragon fear immediately)',
  '9 - Undead - mob',
  '10 - Devils - mob',
  '11 - Dragons - mob',
  '12 - Psychopomps - mob',
  '13 - Spirits - mob',
  '14 - Angels - mob',
  '15 - Garl - this round, all attacks by an enemy get redirected to a different enemy. Argent gets a DC 45 Will save',
  '16 - Io - powerful roar, get filled with energy. For this round, ignores effects that would give them a circumstance penalty to Speed. When they attempt to Escape an effect that has them immobilized, grabbed, or restrained, they automatically succeed. They gain a fly speed of 60 feet, and treat creatures on the ground as off-guard when they are airborne',
  '17 - Amoth - activates all constructs and supercharges them. They wipe out the undead mobs, deal some damage to Argent, and then go away',
  '18 - Yondalla - food springs up from the ground. As interact action, can 3 pieces of food. For each one eaten, either remove an effect or regain 50 HP',
  '19 - Boccob - find yourself in between Boccob and Vecna, with Boccob charging up an energy attack from the crystal. Only way to avoid, spend all actions moving out of the way. Any who remain take 5d12+30 damage. All enemies wiped from board. Whether left or stayed, gain quickened 1 for rest of combat',
  '20 - Boccob - find yourself in between Boccob and Vecna, with Boccob charging up an energy attack from the crystal. Only way to avoid, spend all actions moving out of the way. Any who remain take 5d12+30 damage. All enemies wiped from board. Whether left or stayed, gain quickened 1 for rest of combat'
];

interface ControlsProps {
  readyCount: number;
  playMode: PlayMode;
  setPlayMode: (playMode: PlayMode) => void;
  allDiceRolled: boolean;
  connect: () => Promise<void>;
  d_open: () => Promise<void>;
}

const Controls: FunctionalComponent<ControlsProps> = ({
  readyCount,
  playMode,
  setPlayMode,
  allDiceRolled,
  connect,
  d_open,
}) => {
  const setSetupMode = useCallback(() => setPlayMode("setup"), [setPlayMode]);
  const setTransferMode = useCallback(() => setPlayMode("transfer"), [setPlayMode]);
  const setSilentMode = useCallback(() => setPlayMode("silent"), [setPlayMode]);
  const setListenMode = useCallback(() => setPlayMode("listen"), [setPlayMode]);
  return (
    <div>
      <button class={style.buttonHighlighted} onClick={d_open}>
        Open Display
      </button>
      {playMode === "setup" ? (
        <>
          <p>
            {readyCount < minNumDice
              ? `Click on the button to connect to at least ${minNumDice} Pixel dice.`
              : "Click on Start when you have connected all your dice."}
          </p>
          <button class={style.buttonHighlighted} onClick={connect}>
            Connect To Pixels
          </button>
          {readyCount >= minNumDice ? (
            <button class={style.buttonHighlighted} onClick={setTransferMode}>
              Start
            </button>
          ) : (
            <></>
          )}
        </>
      ) : playMode === "transfer" ? (
        <>
          <p>{`Transferring animations, please wait...`}</p>
        </>
      ) : playMode === "listen" ? (
        <>
          <p>Listening for die roll</p>
          <button class={style.buttonHighlighted} onClick={setSilentMode}>
            Cancel Listen
          </button>
          <button class={style.buttonHighlighted} onClick={setSetupMode}>
            Return to Setup
          </button>
        </>
      ) : (
        <>
        <p>Latests results displayed below</p>
        <button class={style.buttonHighlighted} onClick={setListenMode}>
          Listen
        </button>
        <button class={style.buttonHighlighted} onClick={setSetupMode}>
          Return to Setup
        </button>
        </>
      )}
    </div>
  );
};

interface PixelControlsProps {
  pixel: Pixel;
  disconnect: (pixel: Pixel) => void;
}

const PixelControls: FunctionalComponent<PixelControlsProps> = ({
  pixel,
  disconnect,
}) => {
  const status = usePixelStatus(pixel);

  const reconnect = async (pixel: Pixel) => {
    try {
      await repeatConnect(pixel);
    } catch (error) {
      console.error(error);
    }
  };

  const blink = async (pixel: Pixel) => {
    await pixel.blink(Color.dimYellow, { count: 3, fade: 0.5 });
  };

  const rainbow = async (pixel: Pixel) => {
    const editDataSet = new EditDataSet();
    editDataSet.animations.push(
      new EditAnimationRainbow({
        duration: 3,
        count: 2,
        fade: 0.5,
      })
    );
    await pixel.playTestAnimation(editDataSet.toDataSet());
  };

  return (
    <div class={style.containerButtons}>
      {status === "disconnected" ? (
        <button
          class={style.buttonHighlighted}
          onClick={() => reconnect(pixel)}
        >
          Re-connect
        </button>
      ) : (
        <>
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/blinker.png"
            alt="blink"
            onClick={() => blink(pixel)}
          />
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/rainbow.png"
            onClick={() => rainbow(pixel)}
          />
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/clear.png"
            alt="remove"
            onClick={() => disconnect(pixel)}
          />
        </>
      )}
    </div>
  );
};

interface MainInterfaceProps {
  defaultAppDataSet: AppDataSet;
}

const MainInterface: FunctionalComponent<MainInterfaceProps> = ({
  defaultAppDataSet,
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [playMode, setPlayModeRaw] = useState<PlayMode>("setup");
  const [transferProgresses, setTransferProgresses] = useState<number[]>([]);
  const [rolls] = useState<number[]>([]);
  const [resultText, setResultText] = useState<string>("");
  const [allDiceRolled, setAllDiceRolled] = useState(false);
  const [, setRollAnimTimeoutId] = useState<ReturnType<typeof setTimeout>>();
  
  let results: number[] = [];

  // Store our animations
  const animDataSet = useMemo(() => {
    // Loose animation: blink red twice, with some fading.
    const animLoose = new EditAnimationSimple({
      duration: 1.5,
      color: Color.red,
      count: 2,
      fade: 0.4,
    });

    // Win animation #1: play rainbow twice during 2 seconds,
    // with some fading between colors.
    const animWin1 = new EditAnimationRainbow({
      duration: 2,
      count: 2,
      fade: 0.5,
    });

    // Win animation #2: animate color from green to dark blue,
    // over 2 seconds.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const animWin2 = new EditAnimationGradient({
      duration: 2,
      gradient: EditRgbGradient.createFromKeyFrames([
        { time: 0.2, color: Color.green },
        { time: 0.8, color: Color.dimBlue },
      ]),
    });

    // Win animation #3: use pattern to drive LEDs brightness while
    // animating colors from red to orange to green.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const animWin3 = new EditAnimationGradientPattern({
      duration: 2,
      pattern: defaultAppDataSet.findPattern("Rotating Wide Ring"),
      gradient: EditRgbGradient.createFromKeyFrames([
        { time: 0.15, color: Color.red },
        { time: 0.2, color: Color.orange },
        { time: 0.5, color: Color.yellow },
        { time: 0.7, color: Color.brightGreen },
        { time: 0.85, color: Color.green },
      ]),
    });

    // Build the above animations so they can be uploaded to the dice
    return createDataSetForAnimations([animWin1, animLoose]).toDataSet();
  }, [defaultAppDataSet]);

  const clearRolls = useCallback(() => {
    console.log("Clearing rolls");
    rolls.length = 0;
    results = [];
    setAllDiceRolled(false);
    setRollAnimTimeoutId((rollAnimTimeoutId) => {
      if (rollAnimTimeoutId) {
        console.log("Cancelling playing roll animation");
        clearTimeout(rollAnimTimeoutId);
      }
      return undefined;
    });
    // State "rolls" never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change play mode and clear roll results
  const setPlayMode = useCallback(
    (newPlayMode: PlayMode) => {
      setPlayModeRaw((playMode) => {
        if (newPlayMode !== playMode) {
          clearRolls();
          console.log(`Play mode changed to: ${newPlayMode}`);
          if (newPlayMode === "transfer") {
            setTransferProgresses([]);
            Promise.allSettled(
              pixels.map((pixel, i) => {
                console.log(`Transferring animations to ${pixel.name}`);
                return pixel.transferInstantAnimations(
                  animDataSet,
                  (progress) =>
                    setTransferProgresses((transferProgresses) => {
                      const progresses = [...transferProgresses];
                      progresses[i] = progress;
                      return progresses;
                    })
                );
              })
            )
              .then(() => {
                console.log("Animations transferred to all dice");
                setPlayMode("silent");
              })
              .catch((error) => console.error(error)); //TODO handle fail transfer
          }
        }
        return newPlayMode;
      });
    },
    [animDataSet, clearRolls, pixels]
  );

  const connect = useCallback(async () => {
    // Ask user to select a Pixel
    try {
      clearRolls();
      const pixel = await requestPixel();
      setPixels((pixels) => {
        if (!pixels.includes(pixel)) {
          return [...pixels, pixel];
        }
        return pixels;
      });
      await repeatConnect(pixel);
    } catch (error) {
      console.error(error);
    }
  }, [clearRolls]);

  const d_open = useCallback(async () => {
    console.log("OPEN");
    window.open("/pic","_blank","popup");
  }, []);

  const disconnect = useCallback(
    async (pixel: Pixel) => {
      clearRolls();
      setPixels((pixels) => {
        if (pixels.includes(pixel)) {
          return pixels.filter((p) => p !== pixel);
        }
        return pixels;
      });
      pixel.disconnect();
    },
    [clearRolls]
  );

  // Stopping animations on dismount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clearRolls, []);

  const onRoll = useCallback(
    (pixel: Pixel, face: number, state: PixelRollState) => {
      console.log('DIE ROLL')
      if (playMode === "listen") {
        const index = pixels.indexOf(pixel);
        if (index >= 0) {
          rolls[index] = face;
          const validRollsCount = rolls.filter((f) => !!f).length;
          setAllDiceRolled((allDiceRolled) => {
            const allRolled = pixels.length === validRollsCount;
            if (allDiceRolled !== allRolled) {
              if (!allRolled) {
                results = [];
              }
              return allRolled;
            }
            return allDiceRolled;
          });
        } else {
          console.error(`Got rolled on unknown die: ${pixel.name}`);
        }
      }
    },
    [playMode, pixels, rolls]
  );

  
  const updateImage = () => {
    console.log(results);
    const index = results[0];
    //const randomIndex = Math.floor(Math.random() * imgs.length);
    const img = '/assets/images/gods/'+imgs[index]+'.jpg'

    console.log("CHANGE "+img);
    localStorage.setItem('d_pic',img);
    setResultText(resultTexts[index]);
  };

  useEffect(() => {
    if (playMode === "listen" && allDiceRolled) {
      console.log(
        `All dice rolled: ${pixels
          .map((p, i) => `${p.name} => ${rolls[i]}`)
          .join(", ")}`
      );
      setRollAnimTimeoutId((rollAnimTimeoutId) => {
        if (rollAnimTimeoutId) {
          clearTimeout(rollAnimTimeoutId);
        }
        return setTimeout(() => {
          Promise.allSettled(pixels.map((pixel) => pixel.stopAllAnimations()))
            .then(() => {
              results = rolls;
              updateImage();
              setPlayMode('silent');
              pixels.forEach((pixel, i) =>
                setTimeout(() => {
                  //TODO register timeout with setRollAnimTimeoutId so it's cancelled by clearRolls
                  const win = true;
                  console.log(
                    `Playing ${win ? "win" : "loose"} animation on ${
                      pixel.name
                    }`
                  );
                  pixel
                    .playInstantAnimation(win ? 0 : 1)
                    .catch((error) => console.error(error));
                }, delayBetweenAnimResults * i)
              );
            })
            .catch((error) => console.error(error));
        }, delayBeforeAnimResults);
      });
    }
  }, [allDiceRolled, pixels, playMode, rolls]);

  return (
    <div>
      <p />
      <Controls
        readyCount={pixels.length} //TODO .filter((p) => p.ready).length}
        playMode={playMode}
        setPlayMode={setPlayMode}
        connect={connect}
        d_open={d_open}
        allDiceRolled={allDiceRolled}
      />
      <p />
      <p />
      {pixels.length ? (
        <div>
          <ul>
            {pixels.map((pixel, i) => (
              <li key={pixel}>
                <div>
                  <PixelInfoBox pixel={pixel} onRoll={onRoll}>
                    {playMode === "setup" ? (
                      <PixelControls pixel={pixel} disconnect={disconnect} />
                    ) : (
                      <></>
                    )}
                  </PixelInfoBox>
                  {playMode === "transfer" ? (
                    <div class={style.resultBox}>
                      <text>{`Transfer: ${
                        transferProgresses[i] !== undefined
                          ? `${transferProgresses[i]}%`
                          : "-"
                      }`}</text>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div>
            {playMode === "silent" ? (
              <>
                <p>{resultText}</p>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default MainInterface;

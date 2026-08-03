import { InputLabel, Slider } from "@mui/material";

export interface IMuSliderProps {
  min: number;
  max: number;
  defaultValue: number;
  step: number;
  label: string;
  unit: string;
  value: number;
  onChange: (e: any) => void;
}

export default function MuSlider(props: Readonly<IMuSliderProps>) {
  return (
    <div
      className="w-full px-4 py-2 rounded flex flex-col items-center"
      style={{
        border: "1px solid #bbb",
      }}
    >
      <div className="w-full flex items-end mb-1">
        <InputLabel>{props.label}</InputLabel>
        <div className="font-bold w-12 text-center border-b-2 mx-2">{props.value}</div>
        <div className="font-bold">{props.unit}</div>
      </div>
      <Slider
        className="mx-auto"
        value={props.value}
        defaultValue={props.defaultValue}
        step={props.step}
        min={props.min}
        max={props.max}
        valueLabelDisplay="off"
        onChange={props.onChange}
        marks
      />
    </div>
  );
}

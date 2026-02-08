import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NumericSliderField from "./NumericSliderField";

interface ControlledSliderProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

function ControlledSlider({
  initialValue = 10,
  min = 0,
  max = 100,
  step = 1,
}: ControlledSliderProps) {
  const [value, setValue] = React.useState(initialValue);

  return (
    <NumericSliderField
      id="test-numeric-slider"
      label="Test value"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={setValue}
    />
  );
}

describe("NumericSliderField", () => {
  it("supports keyboard adjustments on the value chip", () => {
    render(<ControlledSlider />);
    const valueChip = screen.getByRole("spinbutton", { name: /test value/i });

    valueChip.focus();
    fireEvent.keyDown(valueChip, { key: "ArrowUp" });
    expect(valueChip).toHaveAttribute("aria-valuenow", "11");

    fireEvent.keyDown(valueChip, { key: "PageDown" });
    expect(valueChip).toHaveAttribute("aria-valuenow", "1");

    fireEvent.keyDown(valueChip, { key: "End" });
    expect(valueChip).toHaveAttribute("aria-valuenow", "100");
  });

  it("supports tap-to-type direct value entry", () => {
    render(<ControlledSlider />);
    const valueChip = screen.getByRole("spinbutton", { name: /test value/i });

    fireEvent.click(valueChip);
    const directInput = screen.getByLabelText("Edit Test value");
    fireEvent.change(directInput, { target: { value: "37" } });
    fireEvent.keyDown(directInput, { key: "Enter" });

    expect(valueChip).toHaveAttribute("aria-valuenow", "37");
  });

  it("cancels direct entry on escape", () => {
    render(<ControlledSlider initialValue={15} />);
    const valueChip = screen.getByRole("spinbutton", { name: /test value/i });

    fireEvent.click(valueChip);
    const directInput = screen.getByLabelText("Edit Test value");
    fireEvent.change(directInput, { target: { value: "65" } });
    fireEvent.keyDown(directInput, { key: "Escape" });

    expect(valueChip).toHaveAttribute("aria-valuenow", "15");
  });

  it("supports horizontal drag on the value chip", () => {
    render(<ControlledSlider />);
    const valueChip = screen.getByRole("spinbutton", { name: /test value/i });

    fireEvent.pointerDown(valueChip, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(valueChip, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 126,
      clientY: 101,
    });
    fireEvent.pointerUp(valueChip, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 126,
      clientY: 101,
    });

    expect(valueChip).toHaveAttribute("aria-valuenow", "12");
  });

  it("supports vertical drag and shift fine control on the value chip", () => {
    render(<ControlledSlider />);
    const valueChip = screen.getByRole("spinbutton", { name: /test value/i });

    fireEvent.pointerDown(valueChip, {
      pointerId: 2,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(valueChip, {
      pointerId: 2,
      pointerType: "mouse",
      clientX: 102,
      clientY: 70,
    });
    fireEvent.pointerUp(valueChip, {
      pointerId: 2,
      pointerType: "mouse",
      clientX: 102,
      clientY: 70,
    });
    expect(valueChip).toHaveAttribute("aria-valuenow", "12");

    fireEvent.pointerDown(valueChip, {
      pointerId: 3,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(valueChip, {
      pointerId: 3,
      pointerType: "mouse",
      clientX: 124,
      clientY: 100,
      shiftKey: true,
    });
    expect(valueChip).toHaveAttribute("aria-valuenow", "12");

    fireEvent.pointerMove(valueChip, {
      pointerId: 3,
      pointerType: "mouse",
      clientX: 160,
      clientY: 100,
      shiftKey: true,
    });
    fireEvent.pointerUp(valueChip, {
      pointerId: 3,
      pointerType: "mouse",
      clientX: 160,
      clientY: 100,
      shiftKey: true,
    });

    expect(valueChip).toHaveAttribute("aria-valuenow", "14");
  });

  it("does not render stepper buttons", () => {
    render(<ControlledSlider />);
    expect(screen.queryByRole("button", { name: /increase test value/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /decrease test value/i })).not.toBeInTheDocument();
  });
});

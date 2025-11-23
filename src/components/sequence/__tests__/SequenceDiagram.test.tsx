import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { useSequenceController } from "@/hooks/useSequenceController";
import { type Sequence } from "@/lib/sequence/types";

const childSequence: Sequence = {
  id: "child-sequence",
  label: "Nested",
  actors: [
    { id: "child-a", label: "Child A" },
    { id: "child-b", label: "Child B" },
  ],
  messages: [
    { id: "child-msg", from: "child-a", to: "child-b", label: "Nested hop" },
  ],
};

const baseSequence: Sequence = {
  id: "base-sequence",
  label: "Base",
  actors: [
    { id: "actor-a", label: "Actor A" },
    {
      id: "actor-b",
      label: "Actor B",
      embeddedSequence: childSequence,
      defaultCollapsed: true,
    },
  ],
  messages: [
    { id: "m1", from: "actor-a", to: "actor-b", label: "Call B" },
    {
      id: "m2",
      from: "actor-b",
      to: "actor-a",
      label: "Return to A",
      messageClass: "warning",
    },
  ],
};

function Harness() {
  const controller = useSequenceController(baseSequence);

  return (
    <div>
      <button onClick={() => controller.api.highlightMessage("m2")}>
        highlight message
      </button>
      <button onClick={() => controller.api.highlightMessageClass("warning")}>
        highlight warnings
      </button>
      <button onClick={() => controller.api.expandActor("actor-b")}>
        expand nested
      </button>
      <SequenceDiagram
        sequence={baseSequence}
        controller={controller}
        showLegend={false}
        height={320}
      />
    </div>
  );
}

describe("SequenceDiagram", () => {
  it("highlights messages via API calls", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByText("highlight warnings"));

    const message = document.querySelector('[data-message-id="m2"]');
    expect(message).toBeInTheDocument();
    expect(message?.className).toContain("ring-2");
  });

  it("expands nested actor sequences", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    expect(
      document.querySelector('[data-sequence-id="child-sequence"]'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("expand nested"));

    expect(
      document.querySelector('[data-sequence-id="child-sequence"]'),
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { useSequenceController } from "@/hooks/useSequenceController";
import { type SequenceDiagramModel } from "@/lib/sequence/types";

const model: SequenceDiagramModel = {
  id: "test-sequence",
  title: "Nested tree",
  actors: [
    {
      actorId: "root",
      label: "Root",
      defaultExpanded: true,
      children: [
        { actorId: "leaf-a", label: "Leaf A" },
        {
          actorId: "branch",
          label: "Branch",
          defaultExpanded: false,
          children: [{ actorId: "leaf-b", label: "Leaf B" }],
        },
      ],
    },
  ],
  messages: [
    {
      messageId: "m1",
      fromActorId: "leaf-a",
      toActorId: "branch",
      label: "A -> branch",
    },
    {
      messageId: "m2",
      fromActorId: "branch",
      toActorId: "leaf-b",
      label: "A -> B",
    },
  ],
};

function Harness() {
  const controller = useSequenceController(model);

  return (
    <div>
      <button onClick={() => controller.api.highlightMessages("m1")}>
        highlight message
      </button>
      <button onClick={() => controller.api.expandActor("branch")}>
        expand nested
      </button>
      <SequenceDiagram model={model} controller={controller} />
    </div>
  );
}

describe("SequenceDiagram", () => {
  it("highlights messages via API calls", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByText("highlight message"));

    const message = document.querySelector('[data-message-id="m1"]');
    expect(message).toBeInTheDocument();
    expect(message?.getAttribute("data-highlighted")).toBe("true");
  });

  it("hides messages for collapsed branches and shows them when expanded", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    expect(
      document.querySelector('[data-message-id="m2"]'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("expand nested"));

    expect(
      document.querySelector('[data-message-id="m2"]'),
    ).toBeInTheDocument();
  });
});

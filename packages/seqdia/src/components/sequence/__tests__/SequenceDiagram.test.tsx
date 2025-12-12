import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { SequenceDiagram } from "../SequenceDiagram";
import { useSequenceController } from "../../../hooks/useSequenceController";
import { defineLinearDiagram, type SequenceDiagramModel } from "../../../lib/sequence/types";

const model: SequenceDiagramModel = defineLinearDiagram({
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
  ] as const,
});

function Harness() {
  const controller = useSequenceController(model);

  return (
    <div>
      <button onClick={() => controller.highlightMessages("m1")}>
        highlight message
      </button>
      <button onClick={() => controller.expandActor("branch")}>
        expand nested
      </button>
      <SequenceDiagram model={model} controller={controller} />
    </div>
  );
}

function HarnessWithEvents({
  onSelectionChange,
  onHighlightChange,
}: {
  onSelectionChange?: ReturnType<typeof vi.fn>;
  onHighlightChange?: ReturnType<typeof vi.fn>;
}) {
  const controller = useSequenceController(model);

  return (
    <div>
      <button onClick={() => controller.highlightMessages("m1")}>
        highlight message
      </button>
      <SequenceDiagram
        model={model}
        controller={controller}
        onSelectionChange={onSelectionChange}
        onHighlightChange={onHighlightChange}
      />
    </div>
  );
}

const selfMessageModel: SequenceDiagramModel = defineLinearDiagram({
  id: "self-message-test",
  title: "Self-referential messages",
  actors: [
    { actorId: "actor-a", label: "Actor A" },
    { actorId: "actor-b", label: "Actor B" },
  ],
  messages: [
    {
      messageId: "m1",
      fromActorId: "actor-a",
      toActorId: "actor-b",
      label: "A -> B",
    },
    {
      messageId: "self",
      fromActorId: "actor-b",
      toActorId: "actor-b",
      label: "Self processing",
    },
    {
      messageId: "m2",
      fromActorId: "actor-b",
      toActorId: "actor-a",
      label: "B -> A",
    },
  ] as const,
});

function SelfMessageHarness() {
  const controller = useSequenceController(selfMessageModel);

  return (
    <div>
      <button onClick={() => controller.highlightMessages("self")}>
        highlight self
      </button>
      <button onClick={() => controller.selectMessages(["self"])}>
        select self
      </button>
      <SequenceDiagram model={selfMessageModel} controller={controller} />
    </div>
  );
}

describe("SequenceDiagram", () => {
  it("renders self-referential messages", () => {
    render(<SelfMessageHarness />);

    const selfMessage = document.querySelector('[data-message-id="self"]');
    expect(selfMessage).toBeInTheDocument();
  });

  it("highlights self-referential messages via API calls", async () => {
    render(<SelfMessageHarness />);
    const user = userEvent.setup();

    await user.click(screen.getByText("highlight self"));

    const selfMessage = document.querySelector('[data-message-id="self"]');
    expect(selfMessage).toBeInTheDocument();
    expect(selfMessage?.getAttribute("data-highlighted")).toBe("true");
  });

  it("selects self-referential messages via API calls", async () => {
    render(<SelfMessageHarness />);
    const user = userEvent.setup();

    await user.click(screen.getByText("select self"));

    const selfMessage = document.querySelector('[data-message-id="self"]');
    expect(selfMessage).toBeInTheDocument();
    expect(selfMessage?.getAttribute("data-selected")).toBe("true");
  });

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

  it("emits selection and highlight change callbacks", async () => {
    const onSelectionChange = vi.fn();
    const onHighlightChange = vi.fn();
    render(
      <HarnessWithEvents
        onSelectionChange={onSelectionChange}
        onHighlightChange={onHighlightChange}
      />,
    );
    const user = userEvent.setup();

    await user.click(
      document.querySelector('[data-actor-id="leaf-a"]') as HTMLElement,
    );

    expect(onSelectionChange).toHaveBeenCalled();
    const selection = onSelectionChange.mock.calls.at(-1)?.[0];
    expect(selection.actors.has("leaf-a")).toBe(true);

    await user.click(screen.getByText("highlight message"));

    expect(onHighlightChange).toHaveBeenCalled();
    const highlight = onHighlightChange.mock.calls.at(-1)?.[0];
    expect(highlight.messages.has("m1")).toBe(true);
  });
});

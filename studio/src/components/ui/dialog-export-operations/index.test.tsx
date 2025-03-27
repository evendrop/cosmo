import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportDialog } from "./index";

describe("ExportDialog", () => {
  const defaultProps = {
    federatedGraphName: "test-graph",
    namespace: "test-namespace",
  };

  it("renders without crashing", () => {
    render(<ExportDialog {...defaultProps} />);
    // Add assertions here
  });

  // Add more test cases here
}); 
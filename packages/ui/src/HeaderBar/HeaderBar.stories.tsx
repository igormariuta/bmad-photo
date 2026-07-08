import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { HeaderBar } from "./HeaderBar";

const meta = {
  title: "Layout/HeaderBar",
  component: HeaderBar,
  args: { wordmark: "EXIF ", wordmarkAccent: "GALLERY" },
} satisfies Meta<typeof HeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LandingWordmark: Story = {
  args: { wordmark: "LAZY ", wordmarkAccent: "CAM" },
};

export const WithActions: Story = {
  args: {
    actions: (
      <Button variant="outline" type="button">
        Add photos
      </Button>
    ),
  },
};

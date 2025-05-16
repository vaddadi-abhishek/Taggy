import mitt from "mitt";

type Events = {
  refreshFeed: void;
  // You can define more events here
};

const eventBus = mitt<Events>();

export default eventBus;

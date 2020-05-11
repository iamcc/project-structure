import makeDemoService from './demoService';

const demoService = makeDemoService({});

declare global {
    type DemoService = typeof demoService;
}
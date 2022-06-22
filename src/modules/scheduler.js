import { SessionManager } from './sessionManager.js';

class Scheduler {

    #pollTaskStatus;

    /**
     * Create scheduler to start tasks.
     *
     * @param {SessionManager} sessionManager The session manager, used for connections to the Hansken servers
     */
    constructor(sessionManager) {
        this.sessionManager = sessionManager;

        const scheduler = this;
        this.#pollTaskStatus = function(taskId, interval, resolve) {
            scheduler.task(taskId).then((schedulerTask) => {
                if (schedulerTask && schedulerTask.task && schedulerTask.task.endedOn) {
                    resolve(schedulerTask);
                    return;
                }
                window.setTimeout(scheduler.#pollTaskStatus, interval, taskId, interval, resolve);
            });
        };
    }

    /**
     * Get all open scheduler tasks.
     *
     * @returns An array of scheduler tasks
     */
    openTasks = () => this.sessionManager.gatekeeper(`/tasks/open`).then(SessionManager.json);

    /**
     * Get all closed scheduler tasks.
     *
     * @returns An array of scheduler tasks
     */
    closedTasks = () => this.sessionManager.gatekeeper(`/tasks/closed`).then(SessionManager.json);

    /**
     * Get a single scheduler task.
     *
     * @param {UUID} taskId The task id
     * @returns A single scheduler task
     */
    task = (taskId) => this.sessionManager.gatekeeper(`/tasks/${taskId}`).then(SessionManager.json);

    /**
     * Start an extraction on a project image.
     *
     * @param {UUID} projectId The project id
     * @param {UUID} imageId The image id, which is added to the request
     * @param {string} imageKey The base64 image key or undefined
     * @param {object} request The extraction request
     * @returns The task id
     */
     extractProjectImage = (projectId, imageId, imageKey, request = {}) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (imageKey) {
            headers['Hansken-Image-Key'] = imageKey;
        }

        request.image = imageId;
        return this.sessionManager.gatekeeper(`/projects/${projectId}/extractions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(request)
        }).then(SessionManager.parseLocationId);
    };

    /**
     * Start an extraction on a singlefile.
     *
     * @param {UUID} singleFileId The singlefile id
     * @param {object} request The extraction request
     * @returns The task id
     */
    extractSinglefile = (singleFileId, request = {}) => this.sessionManager.gatekeeper(`/singlefiles/${singleFileId}/extract`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(SessionManager.parseLocationId);

    /**
     * Retrieve a list of all tools that are available for an extraction.
     *
     * @returns The list of all available tools
     */
    tools = () => this.sessionManager.gatekeeper(`/tools`).then(SessionManager.json);

    /**
     * The tool builder is a simple wrapper around the tools list, to enable or disable tools.
     * The build() result can be used in an extraction request.
     *
     * @returns A tool builder
     */
    toolsBuilder = () => this.tools().then(tools => {
        const enabledTools = {...tools};
        return {
            /**
             * Enable a tool to be used in an extraction.
             *
             * @param {string} name The name of the tool
             * @returns
             */
            enable: function(name) {
                if (enabledTools[name]) {
                    enabledTools[name].defaultEnabled = true;
                }
                return this;
            },
            disable: function(name) {
                if (enabledTools[name]) {
                    enabledTools[name].defaultEnabled = false;
                }
                return this;
            },
            build: function() {
                return Object.keys(enabledTools).filter(tool => tools[tool].defaultEnabled);
            }
        };
    });

    /**
     * Wait for the completion of a scheduled task.
     *
     * @param {UUID} taskId The task id
     * @param {number} interval Milliseconds to wait when polling for task status
     * @returns The scheduledTask when completed
     */
    waitForCompletion = (taskId, interval = 5000) => {
        return new Promise((resolve) => {
            this.#pollTaskStatus(taskId, interval, resolve);
        });
    };
}

export { Scheduler };

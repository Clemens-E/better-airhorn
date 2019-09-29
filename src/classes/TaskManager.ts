import id from 'cuid';
import { promisify } from 'util';

import { Task } from '../structures/models/Task';


export default class TaskHandler {
    private readonly waitTime: number;
    private acceptNewTasks: boolean;
    private tasks: Task[];

    public constructor(waitTime = 10 * 1000) {
        this.waitTime = waitTime;
        this.tasks = [];
        this.acceptNewTasks = true;
    }

    /**
     *Adds a new Task, it should be removed after its finished
     *
     * @returns {string} the id of the task to identify the task
     * @memberof AudioStorage
     * @public
     */
    protected addTask(description = 'Unknown Task'): string {
        if (!this.acceptNewTasks) throw new Error('task was denied');
        const time = Date.now().toString();
        const taskID = `${id()}-${time.substring(time.length / 2, time.length)}`;
        this.tasks.push({
            description: description,
            id: taskID,
            started: Date.now(),
            done: false,
        });
        return taskID;
    }


    /**
     *Removes a Task, requires the taskID
     *
     * @param {string} taskID
     * @returns {boolean} if the task was removed
     * @memberof AudioStorage
     * @private
     */
    protected removeTask(taskID: string): boolean {
        for (let index = 0; index < this.tasks.length; index++) {
            const element = this.tasks[index];
            if (element.id === taskID) {
                this.tasks[index].done = true;
                this.tasks.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    /**
     *Waits until every Tasks finished, or forcefully closes
     *
     * @memberof TaskHandler
     */
    protected async drainTasks(): Promise<boolean> {
        this.acceptNewTasks = false;
        const timeout = promisify(setTimeout);
        let force = false;
        const waited = 0;
        const timeoutMS = (10 / 100) * this.waitTime;
        while (this.tasks.length !== 0) {
            await timeout(timeoutMS);
            if (waited > this.waitTime) {
                force = true;
                break;
            }
        }
        return force;
    }
}

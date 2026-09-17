import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore} from '../useDealStore';

describe('Управлении задачами (Zustand)', () => {
    beforeEach(() => {
        useTaskStore.setState({tasks: []});
    });

    it('должен добавлять новую задачу в список', () => {
        const newTask = {
            id: 'test-1',
            title: 'Купить молоко',
            status: 'TODO' as const,
            order: 0,
            projectId: 'p1'
        };

        useTaskStore.getState().addTask(newTask as any);

        const tasks = useTaskStore.getState().tasks;
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('Купить молоко');
    });
});



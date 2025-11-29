import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Task, TaskStatus } from '../types';

export function useUserTasksForRange(userId: string, from: string, to: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('member_id', userId)
          .gte('date', from)
          .lte('date', to)
          .order('date', { ascending: true });

        if (fetchError) throw fetchError;

        if (isMounted) {
          const mappedTasks: Task[] = (data ?? []).map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description ?? '',
            status: row.status as TaskStatus,
            progress: row.progress ?? 0,
            expectedOutcome: row.expected_outcome ?? '',
            deadline: row.deadline ?? undefined,
            date: row.date,
            start_date: row.start_date ?? null,
            end_date: row.end_date ?? null,
            comments: row.comments ?? [],
            isPrivate: row.is_private ?? false,
            projectId: row.project_id ?? undefined,
            priority: row.priority ?? 'medium',
          }));

          setTasks(mappedTasks);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId && from && to) {
      void fetchTasks();
    }

    return () => {
      isMounted = false;
    };
  }, [userId, from, to]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('member_id', userId)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedTasks: Task[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        status: row.status as TaskStatus,
        progress: row.progress ?? 0,
        expectedOutcome: row.expected_outcome ?? '',
        deadline: row.deadline ?? undefined,
        date: row.date,
        start_date: row.start_date ?? null,
        end_date: row.end_date ?? null,
        comments: row.comments ?? [],
        isPrivate: row.is_private ?? false,
        projectId: row.project_id ?? undefined,
        priority: row.priority ?? 'medium',
      }));

      setTasks(mappedTasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, error, refetch };
}

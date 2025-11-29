import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Task } from '../types';

interface UseProjectTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage project tasks
 * @param projectId - The ID of the project to fetch tasks for
 * @param memberId - Optional member ID to filter tasks by assignee
 * @returns Object containing tasks, loading state, error, and refetch function
 */
export function useProjectTasks(
  projectId: string | null,
  memberId?: string
): UseProjectTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      // Optionally filter by member
      if (memberId) {
        query = query.eq('member_id', memberId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const mappedTasks: Task[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        status: row.status,
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
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('[useProjectTasks] Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, [projectId, memberId]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}

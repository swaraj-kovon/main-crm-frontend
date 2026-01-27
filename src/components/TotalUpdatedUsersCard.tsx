import { useEffect, useState } from 'react';
import { supabase } from '../pages/supabaseClient';
import { StatCard } from './StatCard';

interface TotalUpdatedUsersCardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

export const TotalUpdatedUsersCard = ({ dateRange }: TotalUpdatedUsersCardProps) => {
  const [count, setCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const fetchCount = async () => {
      try {
        let query = supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        if (dateRange.start) {
          query = query.gte('updated_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('updated_at', dateRange.end);
        }

        const { count, error } = await query;

        if (error) throw error;

        setCount(count ?? 0);
        setLastUpdated(new Date().toISOString());
      } catch (error) {
        console.error('Error fetching updated users count:', error);
        setCount(0);
      }
    };

    fetchCount();
  }, [dateRange]);

  return (
    <StatCard 
      label="Total Updated Users"
      value={count}
      updatedAt={lastUpdated}
    />
  );
};

import { ActivitiesList } from './ActivitiesList';

export const BlogSection: React.FC = () => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-wspia-red rounded-full" />
        <h2 className="text-xl font-bold tracking-tight text-ink">
          Aktualności
        </h2>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <ActivitiesList autoRefresh={true} />
      </div>
    </section>
  );
};

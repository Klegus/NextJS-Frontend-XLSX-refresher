import { ActivitiesList } from './ActivitiesList';

export const BlogSection: React.FC = () => {
  return (
    <section className="mt-8">
      <h2 className="text-4xl font-bold mb-8 text-center text-gray-700">
        Blog WSPA
      </h2>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <ActivitiesList autoRefresh={true} />
      </div>
    </section>
  );
};

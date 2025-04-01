import { censorLecturerName } from '../utils/censor';

function CourseInfo({ course }) {
  // Check if censorship is enabled globally via environment variable
  const isCensorshipEnabled = typeof process !== 'undefined' && 
                              process.env.NEXT_PUBLIC_ENABLE_CENSORSHIP === 'true';
  
  // Only apply censorship if it's enabled globally
  const lecturerDisplay = isCensorshipEnabled ? censorLecturerName(course.lecturer) : course.lecturer;
  
  return (
    <div className="course-info">
      <h2>{course.name}</h2>
      <p>
        {course.type} {course.hours}h {lecturerDisplay}
      </p>
      <p>
        daty: {course.dates.join(', ')}
      </p>
      <p>
        sala {course.room} zajęcia w {course.location}
      </p>
    </div>
  );
}

export default CourseInfo; 
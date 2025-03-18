import { censorLecturerName } from '../utils/censor';

function CourseInfo({ course }) {
  return (
    <div className="course-info">
      <h2>{course.name}</h2>
      <p>
        {course.type} {course.hours}h {censorLecturerName(course.lecturer)}
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
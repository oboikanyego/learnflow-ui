export type LessonStatus='BACKLOG'|'SCHEDULED'|'IN_PROGRESS'|'COMPLETED'|'MISSED'|'SKIPPED';
export interface Lesson{_id:string;title:string;description?:string;resourceUrl?:string;position:number;status:LessonStatus;scheduledAt?:string;durationMinutes:number;reminderMinutes:number;evidenceUrl?:string;notes?:string;}
export interface LessonComment{_id:string;lessonId:string;authorId:string;authorName:string;body:string;createdAt:string;updatedAt:string;}
export interface LearningModule{_id:string;title:string;description?:string;position:number;lessons:Lesson[];}
export interface Phase{_id:string;title:string;description?:string;position:number;modules:LearningModule[];}
export interface LearningPath{_id:string;title:string;description?:string;status:string;}
export interface Analytics{learningPaths:number;totalLessons:number;completedLessons:number;missedLessons:number;scheduledLessons:number;completionRate:number;completedHours:number;currentStreakDays:number;}

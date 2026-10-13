import { getCollection, type CollectionEntry } from 'astro:content';
import { componentCategories, lessonSections, type LessonSection } from '@/data/site';

export type Lesson = CollectionEntry<'lessons'>;
export type ComponentPage = CollectionEntry<'components'>;

const byOrder = (a: { data: { order: number; title: string } }, b: { data: { order: number; title: string } }) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export const lessonSection = (entry: Lesson) => entry.id.split('/')[0] as LessonSection;
export const lessonSlug = (entry: Lesson) => entry.id.split('/').slice(1).join('/');

export async function getLessons(section?: LessonSection) {
  const all = await getCollection('lessons', (e) => !e.data.draft);
  return all.filter((e) => !section || lessonSection(e) === section).sort(byOrder);
}

/** Components in sidebar order: by category, then by order within the category. */
export async function getComponents() {
  const cats = Object.keys(componentCategories);
  return (await getCollection('components', (e) => !e.data.draft)).sort(
    (a, b) => cats.indexOf(a.data.category) - cats.indexOf(b.data.category) || byOrder(a, b),
  );
}

export interface NavItem {
  title: string;
  href: string;
  /** Optional sub-heading; shown in the sidebar when it changes between items. */
  group?: string;
}
export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  href: string;
  items: NavItem[];
}

/** Sidebar tree for the docs layout. */
export async function getNav(): Promise<NavGroup[]> {
  const lessons = await getLessons();
  const components = await getComponents();
  const lessonGroup = (id: LessonSection, title: string, icon: string): NavGroup => ({
    id,
    title,
    icon,
    href: `/${id}`,
    items: lessons.filter((l) => lessonSection(l) === id).map((l) => ({ title: l.data.title, href: `/${id}/${lessonSlug(l)}` })),
  });

  return [
    lessonGroup('fundamentals', 'Fundamentals', 'graduation-cap'),
    {
      id: 'components',
      title: 'UI Components',
      icon: 'component',
      href: '/components',
      items: (Object.keys(componentCategories) as (keyof typeof componentCategories)[]).flatMap((cat) =>
        components
          .filter((c) => c.data.category === cat)
          .map((c) => ({ title: c.data.title, href: `/components/${c.id}`, group: componentCategories[cat].title })),
      ),
    },
    lessonGroup('features', 'Features & Flows', 'workflow'),
    lessonGroup('mobile', 'Mobile Testing', 'smartphone'),
    lessonGroup('web', 'Web Testing', 'globe'),
    lessonGroup('tutorials', 'Tutorials', 'notebook-pen'),
    lessonGroup('career', 'QA Career', 'briefcase'),
    { id: 'glossary', title: 'Glossary', icon: 'book-a', href: '/glossary', items: [] },
    { id: 'interview', title: 'Interview Prep', icon: 'messages-square', href: '/interview', items: [] },
  ];
}

export { lessonSections };

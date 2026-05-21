export { MediaService } from './media.service'
export { GenreService } from './genres.service'
export { PeopleService } from './people.service'
export { PlatformsService } from './platforms.service'
export { UsersService } from './users.service'
export { ArticlesService } from './articles.service'
export { AuthorsService } from './authors.service'
export { CuratedListsService } from './curated-lists.service'

export type {
  MediaFilters,
  UpsertMediaInput,
  UpdateEditorialInput,
  UpsertRatingInput,
  SyncVideoInput,
  MediaListResult,
} from './media.service'

export type {
  GenreFilters,
  CreateGenreInput,
  UpdateGenreInput,
  GenreListResult,
  GenreWithMedia,
} from './genres.service'

export type {
  UpsertPersonInput,
  UpdatePersonInput,
  CreditInput,
  PeopleListResult,
  PersonWithFilmography,
} from './people.service'

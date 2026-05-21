export { MediaService } from './media.service.js'
export { GenreService } from './genres.service.js'
export { PeopleService } from './people.service.js'
export { PlatformsService } from './platforms.service.js'
export { UsersService } from './users.service.js'
export { ArticlesService } from './articles.service.js'
export { AuthorsService } from './authors.service.js'
export { CuratedListsService } from './curated-lists.service.js'

export type {
  MediaFilters,
  UpsertMediaInput,
  UpdateEditorialInput,
  UpsertRatingInput,
  SyncVideoInput,
  MediaListResult,
} from './media.service.js'

export type {
  GenreFilters,
  CreateGenreInput,
  UpdateGenreInput,
  GenreListResult,
  GenreWithMedia,
} from './genres.service.js'

export type {
  UpsertPersonInput,
  UpdatePersonInput,
  CreditInput,
  PeopleListResult,
  PersonWithFilmography,
} from './people.service.js'

import type { Context } from 'hono'
import { PersonRepository } from '@vimovies/repositories'
import type { ApiResponse, PersonDetails } from '@vimovies/types'
import { z } from 'zod'

const PersonIdSchema = z.coerce.number().int().positive()


export class PersonController {
    static async getPersonById(c: Context): Promise<any> {
        try {
            const id = PersonIdSchema.parse(c.req.param('id'))
            const person = await PersonRepository.getPersonById(id) as ApiResponse<PersonDetails>;
            console.log(person.data?.place_of_birth)
            return c.json(person, person.success ? 200 : person.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof z.ZodError
                            ? 'Invalid person id'
                            : error instanceof Error
                                ? error.message
                                : 'Internal server error',
                },
                error instanceof z.ZodError ? 400 : 500
            )
        }
    }
}
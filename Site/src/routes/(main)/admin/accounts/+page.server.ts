import formError from "$lib/server/formError"
import { authorise } from "$lib/server/lucia"
import ratelimit from "$lib/server/ratelimit"
import { Record, equery, surql } from "$lib/server/surreal"
import { zod } from "sveltekit-superforms/adapters"
import { message, superValidate } from "sveltekit-superforms/server"
import { z } from "zod"

const schema = z.object({
	username: z
		.string()
		.min(3)
		.max(21)
		.regex(/^[A-Za-z0-9_]+$/),
	password: z.string().min(1).max(6969),
})

export async function load({ locals }) {
	await authorise(locals, 5)

	return { form: await superValidate(zod(schema)) }
}

export const actions: import("./$types").Actions = {}
actions.changePassword = async ({ request, locals, getClientAddress }) => {
	const { user } = await authorise(locals, 5)
	const form = await superValidate(request, zod(schema))
	if (!form.valid) return formError(form)

	const limit = ratelimit(form, "resetPassword", getClientAddress, 30)
	if (limit) return limit

	const { username, password } = form.data

	try {
		await equery(
			surql`
				UPDATE user SET hashedPassword = $npassword
				WHERE string::lowercase(username) = string::lowercase(${username})`,
			{ npassword: Bun.password.hashSync(password) }
		)
	} catch {
		return message(form, "Invalid credentials", {
			status: 400,
		})
	}

	const note = `Change account password for ${username}`
	await equery(
		surql`fn::auditLog("Account", ${note}, ${Record("user", user.id)})`
	)

	return message(form, "Password changed successfully!")
}

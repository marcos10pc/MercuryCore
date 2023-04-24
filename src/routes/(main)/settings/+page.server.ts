import { authorise } from "$lib/server/lucia"
import { prisma } from "$lib/server/prisma"
import { auth } from "$lib/server/lucia"
import formError from "$lib/server/formError"
import { superValidate, message } from "sveltekit-superforms/server"
import { z } from "zod"

const profileSchema = z.object({
	theme: z.enum(["standard", "darken", "storm", "solar"]),
	bio: z.string().max(1000),
})

const passwordSchema = z.object({
	cpassword: z.string().min(1),
	npassword: z.string().min(1),
	cnpassword: z.string().min(1),
})

export const load = async ({ request, locals }) => {
	const { user } = await authorise(locals)

	const getUser = await prisma.authUser.findUnique({
		where: {
			id: user.id,
		},
		include: {
			bio: {
				orderBy: {
					updated: "desc",
				},
				select: {
					text: true,
				},
				take: 1,
			},
		},
	})

	return {
		bio: getUser?.bio, // because can't get nested properties from lucia.ts I think
		theme: getUser?.theme,
		profileForm: superValidate(request, profileSchema),
		passwordForm: superValidate(request, passwordSchema),
	}
}

export const actions = {
	profile: async ({ request, locals }) => {
		const { user } = await authorise(locals)

		const form = await superValidate(request, profileSchema)
		if (!form.valid) return formError(form)

		const { bio, theme } = form.data

		await prisma.authUser.update({
			where: {
				number: user.number,
			},
			data: {
				bio: {
					create: {
						text: bio,
					},
				},
				theme,
			},
		})

		return {
			profileForm: message(form, "Profile updated successfully!").form,
		}
	},

	password: async ({ request, locals }) => {
		const { user } = await authorise(locals)

		const form = await superValidate(request, passwordSchema)
		if (!form.valid) return formError(form)

		const { cpassword, npassword, cnpassword } = form.data

		if (npassword != cnpassword)
			return formError(form, ["cnpassword"], ["Passwords do not match"])

		try {
			await auth.useKey(
				"username",
				user.username.toLowerCase(),
				cpassword
			)
		} catch {
			return formError(
				form,
				["cpassword"],
				["Incorrect username or password"]
			)
		}

		await auth.updateKeyPassword(
			"username",
			user.username.toLowerCase(),
			npassword
		)

		return {
			passwordForm: message(form, "Password updated successfully!").form,
		}
	},
}

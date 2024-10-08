// The friends, followers, and following pages for a user.

import { type RecordId, equery, surql } from "$lib/server/surreal"
import { error } from "@sveltejs/kit"

const usersQueries = Object.freeze({
	// "$id->friends->user OR $id<-friends<-user" doesn't work
	// "$id<->friends<->user" shows yourself in the list (twice)
	friends: surql`
		SELECT status, username
		FROM array::concat($id->friends->user, $id<-friends<-user)`,
	followers: surql`
		SELECT status, username FROM $id<-follows<-user`,
	following: surql`
		SELECT status, username FROM $id->follows->user`,
})
const numberQueries = Object.freeze({
	friends: surql`count($id->friends->user) + count($id<-friends<-user)`,
	followers: surql`count($id<-follows<-user)`,
	following: surql`count($id->follows->user)`,
})

export async function load({ params }) {
	const type = params.f as keyof typeof usersQueries
	const [[user]] = await equery<{ id: RecordId<"user"> }[][]>(surql`
		SELECT id FROM user WHERE username = ${params.username}`)
	if (!user) error(404, "Not found")

	const [users] = await equery<BasicUser[][]>(usersQueries[type], user)
	const [count] = await equery<number[]>(numberQueries[type], user)

	return {
		...params,
		users,
		count,
	}
}

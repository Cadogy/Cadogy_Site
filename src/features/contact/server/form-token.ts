import "server-only"

import { issueFormToken } from "../domain/spam"
import { formSecret } from "./inquiries"

export const freshFormToken = () => issueFormToken(new Date(), formSecret())

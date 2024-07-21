import { CreateNgoDto } from "./create-ngo.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateNgoDto extends PartialType(CreateNgoDto) {}
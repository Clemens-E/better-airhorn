import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class GuildSettings extends BaseEntity {

    @PrimaryColumn()
    guild: string;

    @Column({ length: 5 })
    prefix: string;

    constructor(values?: { guild: string; prefix: string }) {
        super();
        if (values) {
            this.prefix = values.prefix;
            this.guild = values.guild;
        }
    }

}

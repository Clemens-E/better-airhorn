import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Vote } from './Vote';

@Entity()
export class SoundCommand extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    guild: string;

    @Column()
    user: string;

    @Column({ type: 'smallint' })
    privacyMode: number;

    @OneToMany(() => Vote, vote => vote.soundCommand, { lazy: true })
    votes: Vote[];

    constructor(values?: { privacyMode: number; user: string; guild: string; name: string }) {
        super();
        if (values) {
            this.privacyMode = values.privacyMode;
            this.user = values.user;
            this.guild = values.guild;
            this.name = values.name;
        }
    }

}

export enum PrivacyMode {
    ONLY_SEND = 0,
    ONLY_ME = 1,
    ONLY_GUILD = 2,
    EVERYONE = 3,
}
